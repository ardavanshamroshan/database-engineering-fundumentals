<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { withBase } from 'vitepress'

const { Layout } = DefaultTheme

function onSidebarNavigation(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const target = event.target
  if (!(target instanceof Element)) return
  const link = target.closest<HTMLAnchorElement>('.VPSidebar.open a[href]')
  if (!link || link.target === '_blank') return
  const destination = new URL(link.href)
  if (destination.origin !== window.location.origin || !destination.hash) return
  // VitePress closes on page changes; hash links need the same dismissal.
  document.querySelector<HTMLElement>('.VPBackdrop')?.click()
}
</script>

<template>
  <Layout @click.capture="onSidebarNavigation">
    <template #sidebar-nav-after>
      <div class="sidebar-profile">
        <a
          class="sidebar-profile__main"
          href="https://ardavanshamroshan.ir"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            class="sidebar-profile__avatar"
            :src="withBase('/images/avatar.jpg')"
            alt="Ardavan ShamRoshan"
            width="36"
            height="36"
          />
          <span class="sidebar-profile__meta">
            <strong>Ardavan ShamRoshan</strong>
            <em>Contact me</em>
          </span>
        </a>
        <div class="sidebar-profile__links">
          <a href="https://ardavanshamroshan.ir" target="_blank" rel="noopener noreferrer">Website</a>
          <a href="https://github.com/ardavanshamroshan" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="mailto:ardavanshamroshan@yahoo.com">Email</a>
        </div>
      </div>
    </template>
  </Layout>
</template>
