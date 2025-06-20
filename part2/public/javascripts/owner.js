// Vue.js is defined in the HTML file
// eslint-disable-next-line no-undef
const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        const form = ref({
            dog_id: '',
            requested_time: '',
            duration_minutes: '',
            location: ''
        });

        const walks = ref([]);
        const message = ref('');
        const error = ref('');

        // Add walks for computed property
        const dogs = ref([]);

        async function loadWalks() {
            try {
                const res = await fetch('/api/walks');
                walks.value = await res.json();
            } catch (err) {
                error.value = 'Failed to load walk requests';
            }
        }

        async function submitWalkRequest() {
            try {
                const res = await fetch('/api/walks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form.value)
                });
                const result = await res.json();

                if (!res.ok) throw new Error(result.error || 'Error submitting walk request');

                message.value = result.message;
                error.value = '';
                form.value = {
                    dog_id: '',
                    requested_time: '',
                    duration_minutes: '',
                    location: ''
                };
                loadWalks();
            } catch (err) {
                error.value = err.message;
                message.value = '';
            }
        }

        // Logout function from page.js, modified to redirect to login page
        function logout() {
            // Create AJAX Request
            var xmlhttp = new XMLHttpRequest();

            // Open connection to server & send the post data using a POST request
            xmlhttp.open("POST", "/api/users/logout", true);
            xmlhttp.send();

            // Redirect to login page
            window.location.href = "/";
        }

        function loadDogs() {
            // Create AJAX Request to fetch dogs
            let xmlhttp = new XMLHttpRequest();

            // On response
            xmlhttp.onreadystatechange = function () {
                // If successful, parse the response and update the dogs array
                // If error, log the error and alert the user
                if (this.readyState === 4 && this.status === 200) {
                    dogs.value = JSON.parse(this.responseText);
                    console.log("Dogdsdss loaded successfully:", dogs.value);
                } else if (this.readyState === 4) {
                    console.error("Error loading dogs:", this.responseText);
                    alert("Failed to load dogs");
                }
            };
            xmlhttp.open("GET", "/api/users/dogs", true);
            xmlhttp.setRequestHeader("Content-type", "application/json");
            xmlhttp.send();
        }

        onMounted(() => {
            loadWalks();
            loadDogs();
        });

        return {
            form,
            walks,
            message,
            error,
            submitWalkRequest,
            logout,
            dogs
        };
    }
}).mount('#app');
