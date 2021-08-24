class WebView extends HTMLElement {
  scrollCallback = () => {
    if (!document.getElementById(location.hash)) {
      this.shadowRoot.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' })
    }
  }
  connectedCallback() {
    fetch(this.getAttribute('src'))
      .then(response => response.text())
      .then(html => {
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = html;
      })

      window.addEventListener('hashchange', this.scrollCallback, false);
  }

  disconnectedCallback() {
    window.removeEventListener('hashchange', this.scrollCallback)
  }
}

window.customElements.define('html-view', WebView)