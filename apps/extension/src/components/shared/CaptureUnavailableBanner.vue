<template>
  <div class="flex gap-2 px-3 py-2 bg-warn border-b border-warn-edge items-start shrink-0">
    <div
      class="w-3.5 h-3.5 rounded-full bg-warn-ink text-bg text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
    >
      !
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-[11px] font-semibold text-warn-ink leading-tight">Trade capture unavailable</p>
      <p class="text-[10px] text-warn-ink opacity-80 mt-0.5 leading-tight">
        Selectors may be out of date. You can still save by name.
      </p>
    </div>
    <button
      class="text-[11px] font-semibold text-warn-ink bg-transparent border-0 cursor-pointer shrink-0 whitespace-nowrap"
    >
      Check updates
    </button>
  </div>
</template>
