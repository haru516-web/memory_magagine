export function renderOpening() {
  return `
    <section class="opening-screen">
      <div class="opening-screen__inner">
        <div class="opening-screen__stage" aria-label="LANI">
          <div class="opening-screen__noise" aria-hidden="true"></div>
          <div class="opening-screen__glow opening-screen__glow--a" aria-hidden="true"></div>
          <div class="opening-screen__glow opening-screen__glow--b" aria-hidden="true"></div>
          <div class="opening-screen__glow opening-screen__glow--c" aria-hidden="true"></div>
          <canvas class="opening-screen__canvas" id="openingCanvas"></canvas>
        </div>
      </div>
    </section>
  `;
}
