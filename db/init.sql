CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tasks (title, status)
VALUES
    ('Containerize Multi-Tier App with Docker', 'completed'),
    ('Configure Nginx Reverse Proxy & Rate Limiting', 'completed'),
    ('Push Optimized Images to Docker Hub', 'pending')
ON CONFLICT DO NOTHING;
