navbar_items = document.querySelectorAll(".navbar-item");

navbar_items.forEach(item =>{
    item.href += window.location.search
})