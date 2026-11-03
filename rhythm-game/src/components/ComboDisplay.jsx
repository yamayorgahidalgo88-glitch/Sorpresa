export default function ComboDisplay({ combo }) {
  if (combo < 2) return null;
  const tier = combo >= 200 ? 't4' : combo >= 100 ? 't3' : combo >= 50 ? 't2' : combo >= 20 ? 't1' : 't0';
  return (
    <div className={`combo ${tier}`} data-testid="combo">
      <div className="combo-num" key={combo}>
        {combo}
      </div>
      <div className="combo-label">COMBO</div>
      {combo % 50 === 0 && (
        <div className="combo-milestone" key={'m' + combo}>
          {combo} COMBO!
        </div>
      )}
    </div>
  );
}
