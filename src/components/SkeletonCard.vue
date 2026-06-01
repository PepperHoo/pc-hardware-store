<template>
  <div class="skeleton-card">
    <div class="sk-img shimmer" />
    <div class="sk-body">
      <div class="sk-line shimmer" style="width:60%;height:10px;margin-bottom:8px" />
      <div class="sk-line shimmer" style="width:90%;height:14px;margin-bottom:6px" />
      <div class="sk-line shimmer" style="width:80%;height:14px;margin-bottom:16px" />
      <div class="sk-line shimmer" style="width:40%;height:18px" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.06);
  overflow: hidden;
  background: rgba(255,255,255,0.02);
}
.sk-img { height: 200px; }
.sk-body { padding: 16px; }
.sk-line { border-radius: 6px; }

@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.shimmer {
  background: linear-gradient(90deg,
    rgba(255,255,255,0.04) 25%,
    rgba(255,255,255,0.1)  50%,
    rgba(255,255,255,0.04) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.6s infinite linear;
}
</style>
