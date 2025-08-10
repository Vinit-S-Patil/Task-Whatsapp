import { BrowserRouter as Router } from 'react-router-dom';
import AllRoutes from './allroutes.jsx';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <AllRoutes />
      </div>
    </Router>
  );
}

export default App;