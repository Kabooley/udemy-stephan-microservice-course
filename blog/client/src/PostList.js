import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PostList = () => {
    const [posts, setPosts] = useState({});

    const fetchPosts = async () => {
        const res = await axios.get('http://localhost:4000/posts');
        setPosts(res.data);
    };

    /**
     * Effect will run only once (on mount and unmount).
     * This tells React that effect does not depend on any 
     * values from props or state.
     * */ 
    useEffect(() => {
        // DEBUG:
        console.log("effect: PostList()");
        fetchPosts();
    }, []);

    const renderedPosts = Object.values(posts).map(post => {
        return (
            <div 
                className="card" 
                style={{width: "30%", marginBottom: '20px'}}
                key={post.id}
            >
                <div className="card-body">
                    <h3>{post.title}</h3>
                </div>
            </div>
        );
    });

    return (
        <div className="d-flex flex-row flex-wrap justify-content-between">
            {renderedPosts}
        </div>
    );
};

export default PostList;