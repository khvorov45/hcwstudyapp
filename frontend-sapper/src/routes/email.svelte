<script lang="ts">
  import { API_ROOT } from "../lib/config"
  import InputField from "../components/InputField.svelte"
  import Button from "../components/Button.svelte"

  import type { AsyncStatus } from "../lib/util"
  import MultipleChoice from "../components/MultipleChoice.svelte"

  let email = ""
  let whatToSend = "Access link"

  let emailStatus: { status: AsyncStatus; error: string | null } = {
    status: "not-requested",
    error: null,
  }

  async function handleSend() {
    emailStatus.status = "loading"
    emailStatus.error = null
    let res: any
    try {
      res = await fetch(
        `${API_ROOT}/auth/token/send?email=${email.toLowerCase()}&type=${
          whatToSend === "Access link" ? "Session" : "Api"
        }`,
        { method: "POST" }
      )
    } catch (e) {
      emailStatus.status = "error"
      emailStatus.error = "NETWORK_ERROR: " + e.message
      return
    }
    if (res.status !== 204) {
      emailStatus.status = "error"
      emailStatus.error =
        res.status === 409
          ? "Email not found, make sure it's the one associated with the redcap account"
          : await res.text()
    } else {
      emailStatus.status = "success"
      emailStatus.error = null
    }
  }

  function handleInputChange() {
    emailStatus.error = null
    emailStatus.status = "not-requested"
  }
</script>

<div class="email-form">
  <InputField bind:value={email} on:input={handleInputChange} label="Email" />
  <br />
  <MultipleChoice
    question="What to send"
    options={["Access link", "API token"]}
    bind:selected={whatToSend}
    on:input={handleInputChange}
  />
  <br />
  <Button
    action={handleSend}
    loading={emailStatus.status === "loading"}
    success={emailStatus.status === "success"}
    disabled={email === ""}
    errorMsg={emailStatus.error ?? ""}
    ><span slot="standard">Submit</span><span slot="success"
      >Successfully sent</span
    ></Button
  >
</div>

<style>
  .email-form {
    margin-top: 20px;
    margin-left: auto;
    margin-right: auto;
    max-width: 300px;
  }
</style>
