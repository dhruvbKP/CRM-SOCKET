const login = document.getElementById('loginBtn');
login.addEventListener('click', () => {
    const user_id = document.querySelector('input[name="user_id"]').value;
    const userData = {
        user_id: user_id
    }
    fetch(`http://localhost:8070/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'partner_key': 'hzdgQqER+o20SHFOFgFz166Pj2dirjVDdazjlESwz7jafuiAvVF4KjIMudFozU625Uit1aT2fpyMWh3ejXcT0Q=='
        },
        body: JSON.stringify({
            user_id
        })
    })
        .then(response => {
            const resData =  response.json();
            if(resData.status = 'Success'){
                document.cookie = `user=${JSON.stringify(userData)}; path=/;`;
                window.location.href = 'http://localhost:8070/home';
            }
            else{
                alert('invalid User');
            }
        })
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
});