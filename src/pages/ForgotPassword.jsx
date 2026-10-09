import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLogo from "../components/AuthLogo";
export default function ForgotPassword() {
 const [email,setEmail]=useState(""); const navigate=useNavigate();
 function submit(e){e.preventDefault(); const user=JSON.parse(localStorage.getItem("user")||"null"); if(!user||user.email!==email) return alert("No account found with this email."); localStorage.setItem("resetEmail",email); navigate("/otp");}
 return <main className="auth-page"><AuthLogo/><section className="auth-card"><div className="auth-header"><i className="fa-solid fa-key"/><h1>Forgot password?</h1><p>Enter your registered email to continue.</p></div><form onSubmit={submit}><label className="field"><i className="fa-solid fa-envelope"/><input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} required/></label><button className="primary-btn">Continue <i className="fa-solid fa-arrow-right"/></button></form><p className="auth-switch"><Link to="/">Back to sign in</Link></p></section></main>;
}
