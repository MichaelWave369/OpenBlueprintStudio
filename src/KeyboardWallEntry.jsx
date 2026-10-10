import {useState} from 'react';
import {createWall,snap} from './model.js';

/**
 * R24: keyboard-operable alternative to pointer-only wall creation.
 * Creates the same native wall source as the 2D canvas, without bypassing
 * project validation, Undo or human approval boundaries.
 */
export default function KeyboardWallEntry({grid,units,onCreateWall}){
 const [values,setValues]=useState({x1:'3',y1:'3',x2:'13',y2:'3'});
 const [message,setMessage]=useState('');
 const update=(key,value)=>{setValues(old=>({...old,[key]:value}));setMessage('');};
 const add=(event)=>{
  event.preventDefault();
  const numbers={};
  for(const key of ['x1','y1','x2','y2']){
   if(values[key].trim()===''){
    setMessage('Enter a number for each endpoint coordinate.');return;
   }
   const value=Number(values[key]);
   if(!Number.isFinite(value)||Math.abs(value)>10000){
    setMessage('Coordinates must be finite numbers between -10000 and 10000.');return;
   }
   numbers[key]=snap(value,grid);
  }
  const distance=Math.hypot(numbers.x2-numbers.x1,numbers.y2-numbers.y1);
  if(distance<0.1){
   setMessage('Choose two distinct grid positions at least 0.1 units apart.');return;
  }
  try{
   onCreateWall(createWall({x:numbers.x1,y:numbers.y1},{x:numbers.x2,y:numbers.y2}));
   setMessage('Wall added to the drawing and Undo history.');
  }catch{
   setMessage('Wall could not be created. Check the project geometry and input range.');
  }
 };
 return <details className="keyboard-wall-entry" data-testid="keyboard-wall-entry">
   <summary>Keyboard wall entry <span>Enter exact endpoints without a mouse</span></summary>
   <form onSubmit={add} aria-label="Add wall from endpoint coordinates">
     <p>Use Tab to enter start and end coordinates. Values snap to the current {grid} {units} grid. Press Enter to add a native wall; Ctrl+Z can undo it.</p>
     <div className="keyboard-wall-fields">
       {[
         ['x1','Start X'],['y1','Start Y'],['x2','End X'],['y2','End Y'],
       ].map(([key,label])=><label key={key}>{label} ({units})
         <input type="number" name={key} step="any" required
           value={values[key]} onChange={e=>update(key,e.target.value)}/>
       </label>)}
     </div>
     <button type="submit" className="small-button">Add wall from coordinates</button>
     <p role="status" className="keyboard-wall-status" aria-live="polite">{message}</p>
   </form>
 </details>;
}
