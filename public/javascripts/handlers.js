$(document).ready(function() {

    $("#login").submit(function (e) {

        e.preventDefault(); // avoid to execute the actual submit of the form.

        var form = $(this);
        var logData = {};
        $.each(form.serializeArray(), function(){
            logData[this.name] = this.value;
        });
        var logJSON = JSON.stringify(logData);

        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: "/login",
            data: logJSON,
            dataType: "json",
            cache: false,
            success: function (status) {
                if (status.status === "OK") {

                    window.location.href="/";
                }
                else if (status.status === "error")
                {
                    alert("Login failed.");
                }
            },
            error: function (e) {
                console.log("Failure: ", e);
            }
        });


    });

    $("#registration").submit(function (e) {

        e.preventDefault(); // avoid to execute the actual submit of the form.

        var form = $(this);
        var regData = {};
        $.each(form.serializeArray(), function(){
            regData[this.name] = this.value;
        });
        var regJSON = JSON.stringify(regData);

        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: "/adduser",
            data: regJSON,
            dataType: "json",
            cache: false,
            success: function (status) {
                if (status.status === "OK") {
                    window.location.href="/";
                }
                else if (status.status === "error")
                {
                    alert("Registration failed.");
                }
            },
            error: function (e) {
                console.log("Failure: ", e);
            }
        });


    });

    $("#logoutBtn").click(function (e) {

        e.preventDefault();

        $.ajax({
            type: "POST",
            url: "/logout",
            cache: false,
            success: function (status) {
                if (status.status === "OK") {
                    window.location.href="/";
                }
                else if (status.status === "error")
                {
                    alert("Logout failed? Uhhh...");
                }
            },
            error: function (e) {
                console.log("Failure: ", e);
            }
        });
    });
});