@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  py -3 -c "import sys;sys.exit(sys.version_info.major!=3)" >nul 2>nul
  if not errorlevel 1 (
    py -3 -c "import pathlib,sys;exec(pathlib.Path(sys.argv.pop(1)).read_text(encoding='utf-8-sig').split('### PULSE_SERVER_'+'PAYLOAD ###',1)[1])" "%~f0" "%~dp0."
    exit /b
  )
)
python -c "import sys;sys.exit(sys.version_info.major!=3)" >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Python 3。请安装 Python 3 并勾选 Add Python to PATH，然后重新双击。
  pause
  exit /b 1
)
python -c "import pathlib,sys;exec(pathlib.Path(sys.argv.pop(1)).read_text(encoding='utf-8-sig').split('### PULSE_SERVER_'+'PAYLOAD ###',1)[1])" "%~f0" "%~dp0."
exit /b
### PULSE_SERVER_PAYLOAD ###
import sys, os, socket, threading, time, functools, errno
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

def run():
    root=Path(sys.argv[1]).resolve()
    if not (root/'index.html').is_file():
        print('找不到 index.html，请将启动文件放在网站解压目录中。')
        input('按回车退出…');return
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self,*args): pass
        def copyfile(self, source, outputfile):
            try: super().copyfile(source,outputfile)
            except (BrokenPipeError,ConnectionResetError,ConnectionAbortedError): pass
    class Server(ThreadingHTTPServer):
        daemon_threads=True
        def handle_error(self,*args): pass
    port=8080
    while True:
        try:
            server=Server(('0.0.0.0',port),functools.partial(QuietHandler,directory=str(root)))
            break
        except OSError as error:
            if error.errno in (errno.EADDRINUSE,errno.EACCES) or getattr(error,'winerror',0) in (10048,10013):
                print(f'端口 {port} 已被占用或不可用。')
            else:
                print('无法启动服务：'+str(error));input('按回车退出…');return
            while True:
                try:
                    port=int(input('请手动输入其他端口（1024–65535，输入 0 退出）：'))
                    if port==0:return
                    if 1024<=port<=65535:break
                except ValueError:pass
                print('请输入 1024–65535 之间的整数。')
    addresses=set()
    try:
        for item in socket.getaddrinfo(socket.gethostname(),None,socket.AF_INET):
            address=item[4][0]
            if not address.startswith(('127.','169.254.')):addresses.add(address)
    except OSError:pass
    try:
        with socket.socket(socket.AF_INET,socket.SOCK_DGRAM) as sock:
            sock.connect(('192.0.2.1',80))
            address=sock.getsockname()[0]
            if not address.startswith(('127.','169.254.')):addresses.add(address)
    except OSError:pass
    worker=threading.Thread(target=server.serve_forever,daemon=True);worker.start()
    print('\n'+'='*58)
    print('瞎折腾看数据 · 本地服务')
    print('状态：运行中')
    print('本机访问：http://127.0.0.1:'+str(port))
    for address in sorted(addresses):print('局域网访问：http://'+address+':'+str(port))
    if not addresses:print('未识别到局域网 IP，请检查网络连接。')
    print('监听地址：0.0.0.0    端口：'+str(port))
    print('网站目录：'+str(root))
    print('运行方式：静态网站 · 本机历史记录 · 不提供服务器数据库')
    print('访问日志：已关闭')
    print('同一局域网可访问；如无法连接，请检查防火墙。')
    print('保持此窗口打开，按 Ctrl+C 停止服务。')
    print('='*58,flush=True)
    try:
        while worker.is_alive():worker.join(1)
        print('状态：服务已停止')
    except KeyboardInterrupt:print('\n状态：正在停止…')
    finally:
        server.shutdown();server.server_close()
        print('状态：已停止',flush=True)

if __name__=='__main__':run()
