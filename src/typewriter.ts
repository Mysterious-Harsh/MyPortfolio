/** typewriter.ts — cycling typewriter for hero title */
export class Typewriter {
  private el:      HTMLElement;
  private words:   string[];
  private wi  = 0;
  private ci  = 0;
  private del = false;

  constructor(elementId: string, words: string[]) {
    this.el    = document.getElementById(elementId)!;
    this.words = words;
    this.tick();
  }

  private tick() {
    const word = this.words[this.wi];
    this.el.textContent = this.del
      ? word.slice(0, --this.ci)
      : word.slice(0, ++this.ci);

    let delay = this.del ? 35 : 85;

    if (!this.del && this.ci === word.length) {
      delay     = 2500;
      this.del  = true;
    } else if (this.del && this.ci === 0) {
      this.del  = false;
      this.wi   = (this.wi + 1) % this.words.length;
      delay     = 450;
    }

    setTimeout(() => this.tick(), delay);
  }
}
