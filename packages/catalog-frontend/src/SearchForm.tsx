import React, {useState} from 'react';

const SearchForm: React.FC = () => {
    const [query, setQuery] = useState("")

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        window.location.assign(`/_search?q=${query}`)
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text"
                value={query}
                placeholder="Search packages..."
                onChange={e => setQuery(e.target.value)}
                autoFocus />
        </form >
    );
}

export default SearchForm;
