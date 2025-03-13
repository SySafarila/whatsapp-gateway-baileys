## Usage

### Docker

```shell
docker run -dp 3000:3000 sysafarila/whatsapp-baileys:latest
```

then visit your localhost:3000

## API

### Send Message

`POST` http://localhost:3000/send-message

Body:

```json
{
  "phone_number": 62821000000,
  "message": "Hello world!"
}
```

### View QR Code

`GET` http://localhost:3000/qr

### Status

`GET` http://localhost:3000/status

### Logout

`POST` http://localhost:3000/logout
