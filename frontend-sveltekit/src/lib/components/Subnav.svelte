<script lang="ts">
  import Button from "./Button.svelte"
  import Popover from "./Popover.svelte"
  import type { SubnavLink } from "$lib/util"
  import { page } from "$app/stores"
  import DoubleDown from "./icons/DoubleDown.svelte"

  export let links: SubnavLink[] = []

  let widthCumsum = links.reduce((acc, x) => {
    if (acc.length === 0) {
      acc.push(x.width)
      return acc
    }
    let prev = acc[acc.length - 1]
    acc.push(prev + x.width)
    return acc
  }, [])

  let windowWidth = 150
  let dropDownButtonWidth = 30

  let dropDownVisible = false

  $: lastLinkIndex = widthCumsum.findIndex(
    (w) => w > windowWidth - dropDownButtonWidth
  )

  $: linksDisplayed = links.slice(
    0,
    lastLinkIndex === -1 ? links.length : lastLinkIndex
  )
  $: linksInDropdown =
    lastLinkIndex === -1 ? [] : links.slice(lastLinkIndex, links.length)
  $: maxDropdownLinkWidth = linksInDropdown.reduce(
    (max, link) => (link.width > max ? link.width : max),
    0
  )
</script>

<svelte:window bind:innerWidth={windowWidth} />

<div class="subnav">
  {#each linksDisplayed as link}
    <div class="element">
      <a href={link.link}
        ><Button
          width={link.width + "px"}
          active={$page.path === link.link}
          height="var(--size-nav)">{link.title}</Button
        ></a
      >
    </div>
  {/each}
  <div class="element drop-down-button">
    <Button
      width={dropDownButtonWidth + "px"}
      height="var(--size-nav)"
      disabled={lastLinkIndex === -1}
      action={() => (dropDownVisible = !dropDownVisible)}><DoubleDown /></Button
    >
  </div>
  <Popover
    visible={dropDownVisible}
    top="var(--size-nav)"
    left="-{maxDropdownLinkWidth}px"
  >
    {#each linksInDropdown as link}
      <div class="element dropdown">
        <a href={link.link}
          ><Button
            width={link.width + "px"}
            active={$page.path === link.link}
            height="var(--size-nav)">{link.title}</Button
          ></a
        >
      </div>
    {/each}
  </Popover>
</div>

<style>
  a {
    color: inherit;
    text-decoration: none;
  }
  .subnav {
    display: flex;
    height: var(--size-nav);
    border-bottom: 1px solid var(--color-bg-2);
  }
  .drop-down-button {
    margin-left: auto;
  }
  .element.dropdown {
    display: flex;
  }
  .element.dropdown a {
    margin-left: auto;
  }
</style>
