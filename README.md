# linky

a bot

## Setup

edit .example.env with actual information and then rename it to .env

```bash
docker build . -t linky
docker run --detach --env-file .env linky
```
