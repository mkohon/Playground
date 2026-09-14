document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") {
    console.error("Greška: GSAP CDN se nije učitao!");
    return;
  }

  const container = document.querySelector(".carousel-container");
  const slides = gsap.utils.toArray(".slide");
  const toggleBtn = document.getElementById("toggleAutoplay");
  const btnIcon = document.getElementById("btn-icon");
  const btnText = document.getElementById("btn-text");
  
  const imageWidth = 600;
  const gapWidth = 20;   
  const slideWidth = imageWidth + gapWidth; // Ukupni korak za jedan slajd (620px)
  const totalWidth = slides.length * slideWidth; // Ukupna širina svih 6 slajdova (3720px)
  
  // Postavljamo početne vodoravne pozicije za svih 6 slika (0, 620, 1240, 1860...)
  slides.forEach((slide, i) => {
    gsap.set(slide, { x: i * slideWidth });
  });

  // Virtualni objekt koji služi kao stabilan brojač ukupnog skrola
  const scrollProxy = { x: 0 };
  let lastX = 0; // Pamti prošlu poziciju za izračun brzine (blur/opacity)

  let autoplayTween;
  let autoplayTimeout;
  let isAutoplayEnabled = true;

  // 1. STABILNA FUNKCIJA ZA PROJEKCIJU I WRAP ELEMENTA
  function renderCarousel() {
    // Računamo brzinu kretanja u ovom kadru (frame-u)
    let speed = Math.abs(scrollProxy.x - lastX);
    lastX = scrollProxy.x;

    // Izračun blur-a i prozirnosti na temelju brzine
    let blurAmount = Math.min(speed * 0.12, 4);
    let opacityAmount = Math.max(1 - (speed * 0.025), 0.3);

    slides.forEach((slide, i) => {
      // Izračunavamo gdje bi slika trebala biti u linearnom nizu
      let basePosition = (i * slideWidth) + scrollProxy.x;
      
    
      // Čim slika ode lijevo iza -620, automatski se iscrtava na desnom kraju (3100)
      let wrappedX = gsap.utils.wrap(-slideWidth, totalWidth - slideWidth, basePosition);
      
      gsap.set(slide, { 
        x: wrappedX,
        filter: `blur(${blurAmount}px)`,
        opacity: opacityAmount
      });
    });
  }

  // Funkcija koja se poziva kada se kretanje potpuno završi (vraća oštrinu)
  function clearEffects() {
    slides.forEach(slide => {
      gsap.set(slide, { filter: "blur(0px)", opacity: 1 });
    });
  }

  // 2. GLAVNA ANIMACIJA
  function animateTo(targetPosition) {
    gsap.to(scrollProxy, {
      x: targetPosition,
      duration: 1.2,
      ease: "power2.out",
      overwrite: "auto",
      onUpdate: renderCarousel,
      onComplete: clearEffects
    });
  }

  // 3. GSAP AUTOPLAY
  function startAutoplay() {
    if (!isAutoplayEnabled) return;

    autoplayTween = gsap.delayedCall(3, () => {
      // Autoplay prirodno pomiče slike ulijevo (smanjuje x koordinatu)
      animateTo(scrollProxy.x - slideWidth);
      startAutoplay(); 
    });
  }

  function stopAutoplay() {
    if (autoplayTween) autoplayTween.kill();
    clearTimeout(autoplayTimeout);
  }

  startAutoplay();

  // 4. LOGIKA ZA GUMB (Pauza / Pokreni)
  toggleBtn.addEventListener("click", () => {
    if (isAutoplayEnabled) {
      isAutoplayEnabled = false;
      stopAutoplay();
      btnIcon.innerHTML = "▶"; 
      btnText.innerText = "Pokreni";
      toggleBtn.style.backgroundColor = "#10b981"; 
      toggleBtn.style.borderColor = "#059669";
    } else {
      isAutoplayEnabled = true;
      startAutoplay();
      btnIcon.innerHTML = "❚❚"; 
      btnText.innerText = "Pauziraj";
      toggleBtn.style.backgroundColor = "#27272a"; 
      toggleBtn.style.borderColor = "#3f3f46";
    }
  });

  // 5. KOTAČIĆ MIŠA
  container.addEventListener("wheel", (e) => {
    e.preventDefault();
    stopAutoplay();

    // e.deltaY > 0 = skrolanje prema DOLJE pomiče slike UDESNO (targetX raste)
    if (e.deltaY > 0) {
      animateTo(scrollProxy.x + slideWidth);
    } 
    // e.deltaY < 0 = skrolanje prema GORE pomiče slike ULIJEVO (targetX pada)
    else if (e.deltaY < 0) {
      animateTo(scrollProxy.x - slideWidth);
    }

    // Povratak na autoplay nakon 3 sekunde neaktivnosti miša
    if (isAutoplayEnabled) {
      autoplayTimeout = setTimeout(() => {
        startAutoplay();
      }, 3000);
    }
  }, { passive: false });
});
