var configurableURL = "http://127.0.0.1:8000"; //Change this
if(sessionStorage.getItem("userMail")!=null)
{
    window.location = configurableURL+"/toxicity";
}
function hashcode(str)
{
  var hash = 0,i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++)
  {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
}
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');
function togglePanelActive(isSignUp)
{
    if (isSignUp)
    {
        container.classList.add("right-panel-active");
    }
    else
    {
        container.classList.remove("right-panel-active");
    }
}
signUpButton.addEventListener('click', () => {
    var userName = document.getElementById("signUpuserName").value.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
    var userMail = document.getElementById("signUpuserMail").value.toLowerCase();
    var userpwd = document.getElementById("signUpPassword").value;
    var result1 = userName.match(/^[a-zA-Z\s]{4,}$/);
    var result2 = userMail.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    var result3 = userpwd.match(/^[a-zA-Z0-9#_@]{8,}$/);
    if(!(result1 && result2 && result3))
    {
        alert("Enter valid values in the fields!");
        return;
    }
    $.ajaxSetup({
        contentType: "application/json; charset=utf-8"
      });
    $.post({
            url: configurableURL+"/addUser/",
            data: JSON.stringify({"name":userName, "email": userMail, "password":hashcode(userpwd).toString()}),
            success:function(response){
                if(response==="Already there")
                {
                    alert(response);
                }
                else
                {
                    alert("User Added");
                }
            }
        });
});
signInButton.addEventListener('click', () => {
    var username = document.getElementById("username").value.toLowerCase();
    var password = document.getElementById("password").value;
    if(username.length!=0 && password.length!=0)
    {
        var pwd_pattern = /^[a-zA-Z0-9#_@]{8,}$/;
        var result = password.match(pwd_pattern);
        if(result)
        {
            $.get({
                url: configurableURL+"/signin",
                data: {"email":username,"password":hashcode(password).toString()},
                success: function(response)
                {
                    if(response.flag==="1")
                    {
                        window.sessionStorage.setItem("userMail", username);
                        window.sessionStorage.setItem("userName", response.name);
                        window.sessionStorage.setItem("token", response.token);
                        window.location = configurableURL+"/toxicity";
                    }
                    else if(response.flag==="0")
                    {
                        alert("Incorrect username/password");
                    }
                    else
                    {
                        console.log(response.error);
                    }
                },
                dataType: "json"
            });
        }
        else
        {
            alert("Invalid Password!");
            return;
        }
    }
    else if(username.length===0)
    {
        alert("Enter the username!");
        return;
    }
    else
    {
        alert("Enter the password");
        return;
    }
});