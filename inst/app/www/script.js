function get_client_time() {
	var time_now = new Date()
	var client_tz_offset_sec = document.getElementById("client_tz_offset_sec")
	client_tz_offset_sec.value = time_now.getTimezoneOffset() * 60
}

get_client_time()

Shiny.addCustomMessageHandler(
	"themeswitch", function(dark) {switch_theme(dark)}
)

function switch_theme(dark) {
	var extradark_css = document.getElementById("extradark-css")
	var shinytheme_css = document.getElementById("shinytheme-css")
	if (dark) {
		extradark_css.href = "www/extradark.css"
		shinytheme_css.href = "shinythemes/css/cyborg.min.css"
	}
	else {
		extradark_css.href = ""
		shinytheme_css.href = "shinythemes/css/cerulean.min.css"
	}
}
