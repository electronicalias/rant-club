# Encode the MP3 file to Base64 and save to encoded_audio.txt
base64 -i ~/Downloads/8.mp3 -o encoded_audio.txt

# Read the Base64 data into a variable
BASE64_DATA=$(<encoded_audio.txt)

# Use the variable in the curl command
curl -X POST -H "Content-Type: application/json" \
     -d "{\"filename\": \"8.mp3\", \"filedata\": \"$BASE64_DATA\"}" \
     https://ydrzf3z9cf.execute-api.eu-west-2.amazonaws.com/prod/upload
