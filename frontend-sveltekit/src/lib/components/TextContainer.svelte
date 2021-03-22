<div class="scroll">
  <div class="text-container"><slot /></div>
</div>

<style>
  .scroll {
    height: calc(100vh - var(--size-nav));
    overflow-y: scroll;
  }
  .text-container {
    text-align: justify;
    max-width: 56em;
    margin-left: auto;
    margin-right: auto;
    margin-top: 20px;
    padding-left: 10px;
    padding-right: 10px;
  }
</style>
