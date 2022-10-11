document.getElementById("UpExcel").onchange = function (event) {
  xx = event.target.files[0];
  console.log(xx);
  var bodyFormData = new FormData();
  bodyFormData.append("file", xx);
  axios({
    method: "post",
    url: "/fileUpload",
    data: bodyFormData,
    headers: { "Content-Type": "multipart/form-data" },
  })
    .then(function (response) {
      const redirectTo = response.data.replaceAll("\\", "/");
      console.log(redirectTo);
      window.location.href = redirectTo;
    })
    .catch(function (response) {
      //handle error
      console.log(response);
    });
};