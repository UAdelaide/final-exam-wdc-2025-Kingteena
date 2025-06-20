const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        const walks = ref([]);
        const message = ref('');
        const error = ref('');
        const user = 3;

        async function loadWalkRequests() {
            try {
                const res = await fetch('/api/walks');
                if (!res.ok) throw new Error('Failed to load walk requests');
                walks.value = await res.json();
            } catch (err) {
                error.value = err.message;
            }
        }

        async function applyToWalk(requestId) {
            try {
                const res = await fetch(`/api/walks/${requestId}/apply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ walker_id: user })
                });
                const result = await res.json();

                if (!res.ok) throw new Error(result.error || 'Application failed');
                message.value = result.message;
                error.value = '';
                await loadWalkRequests();
            } catch (err) {
                error.value = err.message;
                message.value = '';
            }
        }

        /*
        //This is one way to "get" the current user
        function getCurrentUser() {
          fetch('/api/users/me')
            .then(response => {
              if (!response.ok) throw new Error('Failed to load current user');
              return response.json();
            })
            .then(data => {
              console.log("Current user:", data);
              user.value = data.user_id; // Store user ID in the variable
              return data.user_id;
            })
            .catch(err => {
              console.error("Error fetching current user:", err);
              error.value = 'Failed to load current user';
            });
        }

      */
        // This is an alternate way to get current user details and store it in user
        async function getCurrentUser() {
            try {
                // Create AJAX Request
                const xmlhttp = new XMLHttpRequest();
                xmlhttp.onreadystatechange = function () {
                    if (this.readyState === 4 && this.status === 200) {
                        const response = JSON.parse(this.responseText);
                        // Store user ID in the variable
                        user.value = response.user_id;
                    } else if (this.readyState === 4) {
                        error.value = 'Failed to load current user';
                    }
                };
                // Get user details from the server
                xmlhttp.open("GET", "/api/users/me", true);
                xmlhttp.setRequestHeader("Content-type", "application/json");
                xmlhttp.send();
            } catch (err) {
                console.error("Error in getCurrentUser:", err);
                error.value = 'Failed to load current user';
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

        onMounted(() => {
            loadWalkRequests();
            getCurrentUser();
        });

        return {
            walks,
            message,
            error,
            applyToWalk,
            logout
        };
    }
}).mount('#app');