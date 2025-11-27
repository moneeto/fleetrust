async function fetchData() {
    try {
        const res = await fetch("https://pokeapi.co/api/v2/pokemon/ditto")
        if(!res.ok) { throw new Error ("error jeje")}
        return res.json()
    } catch (error) {
        console.log(error)
    }
}

export default async function Pokemon() {
    let pokemon = await fetchData()
    return (
        <div>{pokemon.name}</div>
    )
}