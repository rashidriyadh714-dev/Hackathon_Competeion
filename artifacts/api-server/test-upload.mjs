import fs from "fs";

async function run() {
  const fileBuf = fs.readFileSync("/Users/mohammedrashid/.gemini/antigravity-ide/brain/9e39371f-cc6b-4330-8b5a-0efda2963823/.user_uploaded/media_1790081196970.jpg");
  const blob = new Blob([fileBuf], { type: "image/jpeg" });
  
  const formData = new FormData();
  formData.append("title", "test.jpg");
  formData.append("file", blob, "test.jpg");

  const response = await fetch("http://localhost:5001/api/v1/sources", {
    method: "POST",
    body: formData,
  });
  
  console.log("Status:", response.status);
  const text = await response.text();
  console.log("Response:", text);
}
run();
