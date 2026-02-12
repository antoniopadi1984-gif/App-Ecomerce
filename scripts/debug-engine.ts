
async function checkEngine() {
    try {
        const res = await fetch("http://localhost:8000/");
        if (res.ok) {
            const data = await res.json();
            console.log("✅ [ENGINE] ONLINE");
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log("💀 [ENGINE] OFFLINE (Status: " + res.status + ")");
        }
    } catch (e: any) {
        console.log("💀 [ENGINE] UNREACHABLE: " + e.message);
    }
}

checkEngine();
