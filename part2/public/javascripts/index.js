const { createApp, onMounted, ref } = Vue;
createApp({
    setup() {
        const dogs = ref([]); // Reactive array to hold dog data

        // Login function provided in page.js, modified to handle form submission
        function login(event) {
            event.preventDefault();

            let user = {
                username: document.getElementById('username').value,
                password: document.getElementById('password').value
            };

            // Create AJAX Request
            const xmlhttp = new XMLHttpRequest();

            // Define function to run on response
            xmlhttp.onreadystatechange = function () {
                if (this.readyState === 4 && this.status === 200) {
                    // Parse the JSON response
                    const response = JSON.parse(this.responseText);
                    if (response.user.role === 'owner') {
                        // Redirect to owner dashboard
                        window.location.href = "owner-dashboard.html";
                    } else if (response.user.role === 'walker') {
                        // Redirect to walker dashboard
                        window.location.href = "walker-dashboard.html";
                    } else {
                        console.error("Unknown user role:", response.user.role);
                        alert("Login failed: Unknown user role");
                    }

                } else if (this.readyState === 4 && this.status >= 400) {
                    console.error("Error response:", this.responseText);
                    alert("Login failed");
                }
            };

            // Open connection to server & send the post data using a POST request
            xmlhttp.open("POST", "/api/users/login", true);
            xmlhttp.setRequestHeader("Content-type", "application/json");
            xmlhttp.send(JSON.stringify(user));
        }
        function updatePhotos() {
            let updatedDogs = dogs.value
            for (let i = 0; i < updatedDogs.length; i++) {
                // Update the photo URL for each dog
                const xmlhttp = new XMLHttpRequest();
                xmlhttp.onreadystatechange = function () {
                    if (this.readyState === 4 && this.status === 200) {
                        // Parse the JSON response and update the photo URL
                        const response = JSON.parse(this.responseText);
                        updatedDogs[i].photo_url = response.message;
                    } else if (this.readyState === 4) {
                        console.error("Error updating photo URL for dog:", updatedDogs[i].dog_id, this.responseText);
                    }
                };
                xmlhttp.open("GET", 'https://dog.ceo/api/breeds/image/random', true);
                xmlhttp.send();
            }
            dogs.value = updatedDogs; // Update the reactive array with new photo URLs
        }

        function updateDogs() {
            // Fetch all registered dogs from the server
            const xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function () {
                if (this.readyState === 4 && this.status === 200) {
                    // Parse the JSON response and update the dogs array
                    dogs.value = JSON.parse(this.responseText);
                    updatePhotos(); // Call the function to update dogs
                } else if (this.readyState === 4) {
                    console.error("Error loading dogs:", this.responseText);
                    alert("Failed to load dogs");
                }
            };
            xmlhttp.open("GET", "/api/dogs", true);
            xmlhttp.setRequestHeader("Content-type", "application/json");
            xmlhttp.send();
        }

        onMounted(() => {
            updateDogs(); // Load dogs when the app is mounted
        })
        return {
            dogs,
            login, // Expose the login function to the template
        };
    },
}).mount('#app');