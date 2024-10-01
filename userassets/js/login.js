const login = document.getElementById('loginBtn');
login.addEventListener('click', () => {
    const user_id = document.querySelector('input[name="user_id"]').value;
    const origin = document.querySelector('input[name="origin"]').value;
    const userData = {
        user_id: user_id,
        origin: origin
    }
    fetch(`http://localhost:7080/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'partner-key': 'oXY/jqOBnI9aZkccy1mFM4R3oKMIiOOwMNi/WFsaRZZQXxOxp+gIba6G9cp5AN/ShQ3f+M+30Ytw4r2ltx0cqg=='
        },
        body: JSON.stringify({
            user_id,
            origin
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