"""Imported only through the isolated test harness' temporary PYTHONPATH."""
import errno
import ipaddress
import os
import socket

_connect = socket.socket.connect
_connect_ex = socket.socket.connect_ex
_allowed_port = int(os.environ["AICANVAS_PORT"])
_extra_ports = {
    int(port)
    for port in (os.environ.get("AIC_TEST_ALLOWED_LOOPBACK_PORTS", "") or "").split(",")
    if port.strip().isdigit()
}

def _allowed(address):
    if not isinstance(address, tuple):  # Unix sockets / multiprocessing IPC
        return True
    host, port = str(address[0]), int(address[1])
    try:
        local = ipaddress.ip_address(host).is_loopback
    except ValueError:
        local = host.lower() == "localhost"
    return local and (port == _allowed_port or port in _extra_ports)

def _offline_connect(sock, address):
    if not _allowed(address):
        raise OSError(errno.ENETUNREACH, "External/model networking disabled by the acceptance harness")
    return _connect(sock, address)

def _offline_connect_ex(sock, address):
    if not _allowed(address):
        return errno.ENETUNREACH
    return _connect_ex(sock, address)

socket.socket.connect = _offline_connect
socket.socket.connect_ex = _offline_connect_ex
