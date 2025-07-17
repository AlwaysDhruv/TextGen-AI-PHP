tsParticles.load("tsparticles", {
  background: { color: { value: "#000000" } },
  particles: {
    number: { value: 60, density: { enable: true, area: 800 } },
    color: { value: "#ffffff" },
    shape: { type: "circle" },
    opacity: { value: 0.5 },
    size: { value: 3 },
    move: {
      enable: true,
      speed: 1,
      direction: "none",
      outMode: "out"
    },
    links: {
      enable: true,
      distance: 150,
      color: "#3b82f6",
      opacity: 0.3,
      width: 1
    }
  },
  interactivity: {
    events: {
      onhover: { enable: true, mode: "grab" }
    },
    modes: {
      grab: {
        distance: 200,
        line_linked: { opacity: 0.5 }
      }
    }
  },
  retina_detect: true
});