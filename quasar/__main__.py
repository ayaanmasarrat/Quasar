import argparse

from .server import make_server


def main():
    parser = argparse.ArgumentParser(description="Run the Quasar synthetic Miami-Dade demo")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    with make_server(args.host, args.port) as server:
        print(f"Quasar synthetic demo: http://{args.host}:{server.server_port}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
