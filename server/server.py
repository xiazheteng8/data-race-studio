"""Personal dashboard history API + static website, Python standard library only."""
import functools
import hmac
import json
import math
import os
from pathlib import Path
import re
import sqlite3
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit

MAX_BYTES = 6 * 1024 * 1024


class APIError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def validate_record(value, record_id):
    if not isinstance(value, dict) or value.get('id') != record_id:
        raise APIError('记录编号无效')
    name = value.get('name')
    if not isinstance(name, str) or not name.strip() or len(name) > 120:
        raise APIError('数据名称无效')
    data = value.get('data', {})
    headers, rows = data.get('headers'), data.get('rows')
    if not isinstance(headers, list) or not 2 <= len(headers) <= 31 or any(not isinstance(h, str) or not h.strip() for h in headers) or len(set(headers)) != len(headers):
        raise APIError('表头无效')
    if not isinstance(rows, list) or not 2 <= len(rows) <= 1000:
        raise APIError('需要 2–1000 个周期')
    times, positive = set(), False
    for row in rows:
        if not isinstance(row, list) or len(row) != len(headers) or not isinstance(row[0], str) or not row[0] or row[0] in times:
            raise APIError('时间或列数无效')
        times.add(row[0])
        for number in row[1:]:
            if number is None:
                continue
            if type(number) not in (int, float) or not math.isfinite(number) or number < 0:
                raise APIError('数值无效')
            positive = positive or number > 0
    if not positive:
        raise APIError('至少需要一个大于零的数值')
    logos = data.get('logos', {})
    if not isinstance(logos, dict):
        raise APIError('图标无效')
    for key, src in logos.items():
        if key not in headers or not isinstance(src, str) or len(src) > 500000 or not re.fullmatch(r'data:image/png;base64,[A-Za-z0-9+/=]+', src):
            raise APIError('图标无效')
    now = int(time.time() * 1000)
    return dict(id=record_id, name=name.strip(), data=dict(headers=headers, rows=rows, logos=logos), settings=value.get('settings') if isinstance(value.get('settings'), dict) else {}, created=now, updated=now)


def initialize_database(path):
    path = Path(path).resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as db:
        db.execute('PRAGMA journal_mode=WAL')
        db.execute('CREATE TABLE IF NOT EXISTS datasets (id TEXT PRIMARY KEY, name TEXT NOT NULL, payload TEXT NOT NULL, created INTEGER NOT NULL, updated INTEGER NOT NULL)')
    return path


def make_handler(public_dir, db_path, token, allowed_origins=''):
    public = Path(public_dir).resolve()
    database = Path(db_path).resolve()
    if database == public or public in database.parents:
        raise ValueError('Database must be outside the public website directory')
    if len(token) < 24:
        raise ValueError('HISTORY_TOKEN must contain at least 24 characters')
    configured_origins = {v.strip() for v in allowed_origins.split(',') if v.strip()}

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(public), **kwargs)

        def allowed_origin(self):
            origin = self.headers.get('Origin')
            if not origin:
                return True
            same_host = urlsplit(origin).netloc == self.headers.get('Host') and urlsplit(origin).scheme in ('http', 'https')
            return same_host or origin in configured_origins

        def json_response(self, payload, status=200):
            body = json.dumps(payload, ensure_ascii=False, allow_nan=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Vary', 'Origin')
            origin = self.headers.get('Origin')
            if origin and self.allowed_origin():
                self.send_header('Access-Control-Allow-Origin', origin)
                self.send_header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
                self.send_header('Access-Control-Allow-Methods', 'GET, PUT, PATCH, DELETE, OPTIONS')
            self.end_headers()
            if self.command != 'OPTIONS':
                self.wfile.write(body)

        def read_json(self):
            try:
                size = int(self.headers.get('Content-Length', '-1'))
            except ValueError:
                raise APIError('内容长度无效')
            if not 0 < size <= MAX_BYTES:
                raise APIError('单份记录需要在 6 MB 以内', 413)
            try:
                return json.loads(self.rfile.read(size))
            except (ValueError, UnicodeError):
                raise APIError('JSON 格式无效')

        def dispatch(self):
            url = urlsplit(self.path)
            if not re.match(r'^/api/history(?:/|$)', url.path):
                return False
            try:
                if not self.allowed_origin():
                    raise APIError('网页地址未在 ALLOWED_ORIGINS 中允许', 403)
                if self.command == 'OPTIONS':
                    self.json_response({}, 204)
                    return True
                supplied = self.headers.get('Authorization', '')
                if not hmac.compare_digest(supplied.encode(), ('Bearer ' + token).encode()):
                    raise APIError('访问密钥不正确', 401)
                record_id = url.path[len('/api/history'):].lstrip('/')
                if record_id and not re.fullmatch(r'[a-zA-Z0-9-]{1,90}', record_id):
                    raise APIError('记录编号无效')
                with sqlite3.connect(database, timeout=20) as db:
                    if not record_id:
                        if self.command != 'GET':
                            raise APIError('请求方式不支持', 405)
                        cursor = parse_qs(url.query).get('cursor', ['0'])[0]
                        if not cursor.isdigit() or int(cursor) > 10000000:
                            raise APIError('分页参数无效')
                        offset = int(cursor)
                        result = db.execute('SELECT payload FROM datasets ORDER BY updated DESC, id LIMIT 101 OFFSET ?', (offset,)).fetchall()
                        records = [json.loads(r[0]) for r in result[:100]]
                        self.json_response(dict(records=[self.summary(r) for r in records], cursor=str(offset + 100) if len(result) > 100 else ''))
                        return True
                    existing = db.execute('SELECT payload FROM datasets WHERE id=?', (record_id,)).fetchone()
                    previous = json.loads(existing[0]) if existing else None
                    if self.command == 'GET':
                        if not previous:
                            raise APIError('记录不存在', 404)
                        self.json_response(previous)
                    elif self.command == 'PUT':
                        record = validate_record(self.read_json(), record_id)
                        record['created'] = previous['created'] if previous else record['created']
                        db.execute('INSERT INTO datasets(id,name,payload,created,updated) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,payload=excluded.payload,updated=excluded.updated', (record_id, record['name'], json.dumps(record, ensure_ascii=False), record['created'], record['updated']))
                        db.commit()
                        self.json_response(self.summary(record))
                    elif self.command == 'PATCH':
                        if not previous:
                            raise APIError('记录不存在', 404)
                        record = validate_record({**previous, 'name': self.read_json().get('name')}, record_id)
                        record['created'] = previous['created']
                        db.execute('UPDATE datasets SET name=?,payload=?,updated=? WHERE id=?', (record['name'], json.dumps(record, ensure_ascii=False), record['updated'], record_id))
                        db.commit()
                        self.json_response(self.summary(record))
                    elif self.command == 'DELETE':
                        db.execute('DELETE FROM datasets WHERE id=?', (record_id,))
                        db.commit()
                        self.json_response(dict(deleted=True, id=record_id))
                    else:
                        raise APIError('请求方式不支持', 405)
            except APIError as error:
                self.json_response(dict(error=str(error)), error.status)
            except (sqlite3.Error, ValueError, TypeError, AttributeError):
                self.json_response(dict(error='服务器读写失败，请检查数据库目录权限和请求格式'), 500)
            return True

        @staticmethod
        def summary(record):
            return dict(id=record['id'], name=record['name'], created=record['created'], updated=record['updated'], series=len(record['data']['headers']) - 1, periods=len(record['data']['rows']))

        def do_GET(self):
            if not self.dispatch():
                super().do_GET()

        def do_HEAD(self):
            if self.path.startswith('/api/'):
                self.send_error(405)
            else:
                super().do_HEAD()

        def do_OPTIONS(self):
            if not self.dispatch():
                self.send_error(404)

        def do_PUT(self):
            if not self.dispatch():
                self.send_error(404)

        do_PATCH = do_PUT
        do_DELETE = do_PUT

    return Handler


if __name__ == '__main__':
    base = Path(__file__).resolve().parent
    public_dir = Path(os.environ.get('PUBLIC_DIR', str(base / 'public')))
    db_path = initialize_database(os.environ.get('HISTORY_DB', str(base / 'data/history.sqlite3')))
    handler = make_handler(public_dir, db_path, os.environ.get('HISTORY_TOKEN', ''), os.environ.get('ALLOWED_ORIGINS', ''))
    port = int(os.environ.get('PORT', '8080'))
    print('Dashboard and SQLite history listening on port', port, flush=True)
    ThreadingHTTPServer(('0.0.0.0', port), handler).serve_forever()
