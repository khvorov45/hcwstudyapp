function get_client_time() {
	var time_now = new Date()
	var client_tz_offset_sec = document.getElementById("client_tz_offset_sec")
	client_tz_offset_sec.value = time_now.getTimezoneOffset() * 60
}

get_client_time()
