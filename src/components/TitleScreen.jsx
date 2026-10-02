export default function TitleScreen() {
  return (
    <div className="title-screen">
      <div className="title-screen__rays" />
      <div className="title-screen__ground" />
      <div className="title-screen__ball" aria-hidden="true">
        <span className="title-screen__ball-q">?</span>
      </div>
      <h1 className="title-screen__title outline-text">
        <span>WHO'S THAT</span>
        <span>POKÉMON?</span>
      </h1>
      <p className="title-screen__subtitle">Test your Pokédex knowledge</p>
      <p className="title-screen__prompt">PRESS START</p>
    </div>
  );
}
