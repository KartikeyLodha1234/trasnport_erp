import React, { useState } from 'react';
import styled from 'styled-components';

const Form = () => {
    // स्टेप मैनेज करने के लिए स्टेट (1 = पहला पेज, 2 = दूसरा पेज)
    const [step, setStep] = useState(1);
    const [fileName, setFileName] = useState("Not selected file");

    // फाइल चेंज होने पर नाम अपडेट करने के लिए
    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFileName(e.target.files[0].name);
        } else {
            setFileName("Not selected file");
        }
    };

    // फॉर्म सबमिट होने पर
    const handleSubmit = (e) => {
        e.preventDefault();
        if (step === 1) {
            setStep(2);
        } else {
            alert("Registration Successful!");
        }
    };

    return (
        <StyledWrapper>
            <form className="form" onSubmit={handleSubmit}>
                <p className="title">Register </p>
                <p className="message">
                    {step === 1 ? "Signup now and get full access to our app." : "Set your professional & security credentials."}
                </p>

                {/* STEP 1: बेसिक डिटेल्स */}
                {step === 1 && (
                    <div className="step-container">
                        <div className="flex">
                            <label>
                                <input className="input" type="text" placeholder=" " required />
                                <span>Firstname</span>
                            </label>
                            <label>
                                <input className="input" type="text" placeholder=" " required />
                                <span>Lastname</span>
                            </label>
                        </div>
                        <label>
                            <input className="input" type="email" placeholder=" " required />
                            <span>Email</span>
                        </label>
                        <label>
                            <input className="input" type="number" placeholder=" " required />
                            <span>Phone</span>
                        </label>
                        <label>
                            <input className="input date-input" type="date" required />
                            <span>Date of Birth</span>
                        </label>
                        <button type="submit" className="submit">Next</button>
                    </div>
                )}

                {/* STEP 2: बाकी की डिटेल्स + फाइल अपलोडर */}
                {step === 2 && (
                    <div className="step-container">
                        {/* ड्रॉपडाउन */}
                        <label className="select-label">
                            <select className="input select-input" required defaultValue="">
                                <option value="" ></option>
                                <option value="fresher">Fresher (कोई अनुभव नहीं)</option>
                                <option value="1-2">1 - 2 Years</option>
                                <option value="3-5">3 - 5 Years</option>
                                <option value="5+">5+ Years</option>
                            </select>
                            <span>Experience</span>
                            <div className="arrow"></div>
                        </label>
                        <label className="select-label">
                            <select className="input select-input" required defaultValue="">
                                <option value="" disabled hidden></option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                            <span>Driving License</span>
                            <div className="arrow"></div>
                        </label>

                        {/* फाइल अपलोडर कंटेनर जो आपने माँगा था */}
                        {/* फाइल अपलोडर कंटेनर */}
                        <div className="file-container">
                            <label htmlFor="file" className="file-header">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 15.4806 20.1956 16.8084 19 17.5M7 10C4.79086 10 3 11.7909 3 14C3 15.4806 3.8044 16.8084 5 17.5M7 10C7.43285 10 7.84965 10.0688 8.24006 10.1959M12 12V21M12 12L15 15M12 12L9 15" stroke="#00bfff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <p>Browse File to upload!</p>
                            </label>

                            <div className="file-footer">
                                <svg fill="#00bfff" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15.331 6H8.5v20h15V14.154h-8.169z" />
                                    <path d="M18.153 6h-.009v5.342H23.5v-.002z" />
                                </svg>
                                <p>{fileName}</p>
                                {fileName !== "Not selected file" && (
                                    <svg className="delete-icon" onClick={(e) => { e.preventDefault(); setFileName("Not selected file"); }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z" stroke="#ff4a4a" strokeWidth={2} />
                                        <path d="M19.5 5H4.5" stroke="#ff4a4a" strokeWidth={2} strokeLinecap="round" />
                                        <path d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z" stroke="#ff4a4a" strokeWidth={2} />
                                    </svg>
                                )}
                            </div>
                            <input id="file" type="file" onChange={handleFileChange} />
                        </div>

                        <label>
                            <input className="input" type="password" placeholder=" " required />
                            <span>Password</span>
                        </label>
                        <label>
                            <input className="input" type="password" placeholder=" " required />
                            <span>Confirm password</span>
                        </label>

                        <div className="button-group">
                            <button type="button" className="back-btn" onClick={() => setStep(1)}>Back</button>
                            <button type="submit" className="submit">Submit</button>
                        </div>
                    </div>
                )}

                <p className="signin">Already have an acount ? <a href="/">Signin</a> </p>
            </form>
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
  display: grid;
  place-items: center;
  min-height: 100vh;
  width: 100%;
  background-color: #0f172a; 
  box-sizing: border-box;
  padding: 20px;
  /* --- बैकग्राउंड इमेज सेटिंग्स --- */
  background-image: linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.8)), 
                    url('https://images.unsplash.com/photo-1559297434-fae8a1916a79?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8bG9naXN0aWN8ZW58MHx8MHx8fDA%3D');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  .form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 380px;
    padding: 32px 28px;
    border-radius: 20px;
    position: relative;
    background-color: #161b22;
    color: #fff;
    border: 1px solid #30363d;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  }

  .step-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .title {
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -1px;
    position: relative;
    display: flex;
    align-items: center;
    padding-left: 30px;
    color: #00bfff;
    margin: 0 0 4px 0;
  }

  .title::before,
  .title::after {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    border-radius: 50%;
    left: 0px;
    background-color: #00bfff;
  }

  .title::after {
    animation: pulse 1s linear infinite;
  }

  .message {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 12px 0;
    min-height: 20px;
  }

  .signin {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
    margin: 8px 0 0 0;
  }

  .signin a:hover {
    text-decoration: underline;
  }

  .signin a {
    color: #00bfff;
    font-weight: 600;
    text-decoration: none;
  }

  .flex {
    display: flex;
    width: 100%;
    gap: 10px;
  }

  .flex label {
    flex: 1;
  }

  .form label {
    position: relative;
    display: block;
  }

  .form label .input {
    background-color: #21262d; 
    color: #fff;
    width: 100%;
    padding: 22px 12px 6px 12px;
    outline: 0;
    border: 1px solid #30363d;
    border-radius: 10px;
    font-size: 14px;
    box-sizing: border-box;
    transition: border-color 0.2s ease;
  }

  .form label .input:focus {
    border-color: #00bfff;
  }

  /* फ्लोटिंग लेबल सिस्टम */
  .form label span {
    color: rgba(255, 255, 255, 0.4);
    position: absolute;
    left: 12px;
    top: 14px;
    font-size: 14px;
    cursor: text;
    transition: 0.2s ease all;
    pointer-events: none;
  }

  .form label .input:focus + span,
  .form label .input:not(:placeholder-shown) + span,
  .form label .date-input + span {
    color: #00bfff;
    top: 4px;
    font-size: 11px;
    font-weight: 600;
  }

  /* ड्रॉपडाउन के विशेष स्टाइल्स */
  .select-label {
    position: relative;
  }

  .select-input {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    cursor: pointer;
  }

  .select-label .arrow {
    position: absolute;
    right: 15px;
    top: 24px;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid rgba(255, 255, 255, 0.6);
    pointer-events: none;
    transition: transform 0.2s ease;
  }

  .select-input:focus ~ .arrow {
    border-top-color: #00bfff;
    transform: rotate(180deg);
  }

  .select-input:focus + span,
  .select-input:not([value=""]) + span,
  .select-input:valid + span {
    color: #00bfff;
    top: 4px;
    font-size: 11px;
    font-weight: 600;
  }

  /* --- फ़ाइल अपलोडर डार्क मोड स्टाइल --- */
  .file-container {
    height: 160px;
    width: 100%;
    border-radius: 15px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 8px;
    gap: 5px;
    background-color: #ffffff;
    border: 1px solid #30363d;
    box-sizing: border-box;
  }

  .file-header {
    flex: 1;
    width: 100%;
    border: 2px dashed #00bfff;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background-color: rgba(0, 191, 255, 0.03);
  }

  .file-header svg {
    height: 50px;
  }

  .file-header p {
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
    margin: 4px 0 0 0;
  }

  .file-footer {
    background-color: #161b22;
    width: 100%;
    height: 38px;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #fff;
    border: 1px solid #30363d;
    box-sizing: border-box;
  }

  .file-footer svg {
    height: 22px;
    width: 22px;
    fill: #00bfff;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
    padding: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .file-footer svg:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .file-footer p {
    flex: 1;
    text-align: center;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0 8px;
  }

  #file {
    display: none;
  }

  /* बटन सेटिंग्स */
  .button-group {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }

  .submit, .back-btn {
    border: none;
    outline: none;
    padding: 14px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s ease;
    flex: 1;
  }

  .submit {
    color: #fff;
    background-color: #00bfff;
  }

  .submit:hover {
    background-color: #009cd6;
  }

  .back-btn {
    color: #fff;
    background-color: #30363d;
    border: 1px solid #8b949e;
  }

  .back-btn:hover {
    background-color: #21262d;
  }

  @keyframes pulse {
    from {
      transform: scale(0.9);
      opacity: 1;
    }
    to {
      transform: scale(1.8);
      opacity: 0;
    }
  }
`;

export default Form;