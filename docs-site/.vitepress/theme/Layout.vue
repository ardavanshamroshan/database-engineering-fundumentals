<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { withBase } from 'vitepress'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
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
