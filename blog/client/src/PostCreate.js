import React, { useState } from 'react';
import axios from 'axios';

const PostCreate = () => {
    const [title, setTitle] = useState('');

    /**
     * submitされたらinputフォームのタイトルを投稿する
     * 
     * 投稿先は`http://localhost:4000/posts`である
     * */ 
    const onSubmit = async (event) => {
        event.preventDefault();

        console.log(`post`);
        console.log(title);

        await axios.post('http://localhost:4000/posts', {
            title
        })
        .catch(e => {
            console.error(e);
        });
    };

    return (<div>
        <form onSubmit={onSubmit}>
            <div className="form-group">
                <label>Title</label>
                <input 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="form-control" />
            </div>
            <button className="btn btn-primary" type="sbumit">Submit</button>
        </form>
    </div>);
};

export default PostCreate;