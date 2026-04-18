#!/bin/bash

# Get your JWT token first
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTRiNzlhMmI0NDFmOWUxMjdkZjlkNTgiLCJ1c2VybmFtZSI6ImRocnV2LXRlc3QwMSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzY5NjY3ODIyLCJleHAiOjE3NzAyNzI2MjJ9.BrzCog_oTAANyRIvUFkYX2SvgqBqZw99IeLsQjozRQM"

# Test file upload
curl -X POST http://localhost:9000/api/file-analysis-v2 \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/C:/Users/BAPS.DESKTOP-P2HTS9B/Downloads/virus/eicar_com.zip" \
  -F "label=Postman Test" \
  -v
