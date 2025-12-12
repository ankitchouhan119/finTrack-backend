
### Docker build and Run 

```
docker build -f Docker-local -t backend .

docker run --rm -p 5000:5000 \                                                                                     
  -v "/service-account-location/serviceAccountKey.json":/app/serviceAccountKey.json:ro \
  backend

  ```

