// ==========================
// HAMBURGER MENU
// ==========================

const menuToggle = document.querySelector(".menu-toggle");
const menu = document.querySelector(".menu");

menuToggle.addEventListener("click", () => {
    menu.classList.toggle("active");
});

// ==========================
// TUTUP MENU SETELAH DIKLIK
// ==========================

document.querySelectorAll(".menu a").forEach(link => {
    link.addEventListener("click", () => {
        menu.classList.remove("active");
    });
});

// ==========================
// NAVBAR SCROLL
// ==========================

const header = document.querySelector("header");

window.addEventListener("scroll", () => {

    if(window.scrollY > 50){

        header.classList.add("scrolled");

    }else{

        header.classList.remove("scrolled");

    }

});

// ==========================
// SMOOTH SCROLL
// ==========================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener("click", function(e){

        e.preventDefault();

        const target = document.querySelector(this.getAttribute("href"));

        if(target){

            target.scrollIntoView({

                behavior:"smooth"

            });

        }

    });

});