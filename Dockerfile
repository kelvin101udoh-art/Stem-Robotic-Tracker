# Step 1: Use an official lightweight web server brain from Docker Hub
FROM nginx:alpine

# Step 2: Copy a test message into the container's web directory
RUN echo "<h1>Hello from inside my first Docker Container!</h1>" > /usr/share/nginx/html/index.html

# Step 3: Open up port 80 so the internet can see it
EXPOSE 80
