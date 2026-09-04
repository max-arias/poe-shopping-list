<script setup lang="ts">
import { computed } from "vue";
import { renderOverviewMarkdown } from "./overview-markdown";

const props = defineProps<{
  value: string;
}>();

const renderedMarkdown = computed(() => renderOverviewMarkdown(props.value));
</script>

<template>
  <div class="overview-markdown" v-html="renderedMarkdown" />
</template>

<style scoped>
.overview-markdown {
  color: var(--poe-ink-muted);
  font-size: 11px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.overview-markdown :deep(p) {
  margin: 0 0 0.55rem;
}

.overview-markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.overview-markdown :deep(h1),
.overview-markdown :deep(h2),
.overview-markdown :deep(h3),
.overview-markdown :deep(h4),
.overview-markdown :deep(h5),
.overview-markdown :deep(h6) {
  color: var(--poe-ink);
  font-weight: 600;
  line-height: 1.3;
  margin: 0.75rem 0 0.3rem;
}

.overview-markdown :deep(h1) {
  font-size: 15px;
}

.overview-markdown :deep(h2) {
  font-size: 14px;
}

.overview-markdown :deep(h3),
.overview-markdown :deep(h4),
.overview-markdown :deep(h5),
.overview-markdown :deep(h6) {
  font-size: 12px;
}

.overview-markdown :deep(ul),
.overview-markdown :deep(ol) {
  margin: 0.25rem 0 0.65rem;
  padding-left: 1.25rem;
}

.overview-markdown :deep(li) {
  margin: 0.15rem 0;
}

.overview-markdown :deep(a) {
  color: var(--poe-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.overview-markdown :deep(a:hover) {
  color: var(--poe-ink);
}

.overview-markdown :deep(em) {
  font-style: italic;
}

.overview-markdown :deep(strong) {
  color: var(--poe-ink);
  font-weight: 600;
}

.overview-markdown :deep(code) {
  background: var(--poe-surface);
  border: 1px solid var(--poe-stroke-soft);
  border-radius: 2px;
  color: var(--poe-ink);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.92em;
  padding: 0.08rem 0.25rem;
}
</style>
