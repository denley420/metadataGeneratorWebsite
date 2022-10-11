const xlsx = require("xlsx");
const fs = require("node:fs/promises");
const fss = require("fs");
const express = require("express");
const path = require("path");
const formidableMiddleware = require("express-formidable");
const serveindex = require("serve-index");
const app = express();
const crypto = require("crypto");
const AdmZip = require("adm-zip");

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function unflatten(obj) {
  const _data = {};
  for (const [_key, _value] of Object.entries(obj)) {
    const _keyParse = _key.split(".");
    let _dataTraverser = _data;
    let _lastKey = _keyParse.pop();
    for (let key_ of _keyParse) {
      if (!_dataTraverser[key_]) {
        _dataTraverser[key_] = {};
      }
      _dataTraverser = _dataTraverser[key_];
    }
    _dataTraverser[_lastKey] = _value;
  }
  return _data;
}

function onlyNumbers(array) {
  return array.every((element) => {
    return !isNaN(element);
  });
}

function arrayify(obj) {
  let _cObj = obj;

  if (
    typeof _cObj === "string" ||
    typeof _cObj === "number" ||
    typeof _cObj === "boolean"
  ) {
    return _cObj;
  } else if (!Array.isArray(_cObj)) {
    // we assume that object is not an array, which is an object
    _cObj = Object.fromEntries(
      Object.entries(_cObj).filter(([k__, v__]) => v__ !== "--")
    );
  }

  // call the arrayify function recursively on children
  // do recursive calls on each of the branch
  for (let k of Object.keys(_cObj)) {
    // check if branch is an object or an immutable
    _cObj[k] = arrayify(_cObj[k]);
  }

  // on glimpse of list, decide if items are in array format or not
  if (onlyNumbers(Object.keys(_cObj))) {
    let _arr = Object.values(_cObj);
    return _arr;
  } else {
    return _cObj;
  }
}

// setup static and middleware
app.use("/public", express.static("./public"));

app.use("/public", serveindex("./public"));

app.use(formidableMiddleware());

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./index.html"));
});

app.post("/fileUpload", async (req, res) => {
  const filepath = req.files.file.path;
  const wb = xlsx.readFile(filepath);
  const sheetName = wb.SheetNames[0];
  const sheetValue = wb.Sheets[sheetName];

  let excelData = xlsx.utils.sheet_to_json(sheetValue);
  console.log(excelData[1]);
  const dir = `${__dirname}\\public\\metadata\\${uuidv4()}`;
  // remove dir if it exists
  if (fss.existsSync(dir)) {
    fss.rmdirSync(dir, { recursive: true });
  }
  fss.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < excelData.length; i++) {
    fss.writeFileSync(
      `${dir}\\${excelData[i].token_id}.json`,
      JSON.stringify(arrayify(unflatten(excelData[i])), null, 4)
    );
  }
  const outputFile = `${dir}\\test.zip`;
  async function createZipArchive() {
    try {
      const zip = new AdmZip();
      zip.addLocalFolder(dir);
      await zip.writeZip(outputFile);
      console.log(`Created ${outputFile} successfully`);
    } catch (e) {
      console.log(`Something went wrong. ${e}`);
    }
  }

  await createZipArchive();
  return await res.send(outputFile.replace(__dirname, ""));
  // res.sendFile(`./index.html`)
});

app.all("*", (req, res) => {
  res.status(404).send("resource not found");
});

app.listen(5000, () => {
  console.log("server is listening on port 5000....");
});
