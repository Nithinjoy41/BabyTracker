async function test() {
    try {
        const url = 'http://localhost:5288/api';
        
        // 1. Register
        const authRes = await fetch(`${url}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `test_${Date.now()}@test.com`,
                password: "Password123!",
                fullName: "Test User"
            })
        });
        const authData = await authRes.json();
        const token = authData.token;
        console.log("Registered. Token length:", token ? token.length : 0);
        
        // 2. Add Child
        const res = await fetch(`${url}/children`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: "Leo",
                dateOfBirth: "2024-05-15"
            })
        });
        
        const data = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", data);
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
