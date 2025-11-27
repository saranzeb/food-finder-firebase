import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

const agent = new HttpsProxyAgent("http://127.0.0.1:7897");

fetch("https://api.openai.com/v1/models", {
  method: "GET",
  agent,
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
  },
})
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);
