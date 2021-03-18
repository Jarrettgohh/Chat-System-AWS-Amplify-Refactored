import React, { useState, useEffect, useRef } from "react";
import { Form, Button, Row, Container, Col } from "react-bootstrap";
// import http from "./services/httpService";
import "./css/form.css";
import "./css/message.css";

const Client = () => {
  const ws = useRef();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [id, setId] = useState(null);
  const bottomContainer = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(
      "wss://k7exuk82x7.execute-api.ap-southeast-1.amazonaws.com/dev"
    );

    const id = Date.now();
    setId(id);
  }, []);

  useEffect(() => {
    ws.current.onopen = () => {
      console.log("Connected!");
      ws.current.send(JSON.stringify({ action: "init" }));
    };

    ws.current.onerror = (err) => {
      console.log(err);
    };

    ws.current.onclose = () => {
      console.log("Closed!");
    };

    ws.current.onmessage = (newMessage) => {
      const receivedMessage = JSON.parse(newMessage.data);
      setMessages((oldMsgs) => [...oldMsgs, receivedMessage]);
      bottomContainer.current.scrollIntoView({ behavior: "smooth" });
    };
  }, [messages]);

  const handleTyping = (e) => {
    const inputMessage = e.target.value;
    setMessage(inputMessage);
  };

  const handleSend = (e) => {
    e.preventDefault();

    ws.current.send(
      JSON.stringify({ action: "message", content: message, senderId: id })
    );
    setMessage("");
    bottomContainer.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <React.Fragment>
      <Container id="container-style">
        {messages &&
          messages.map((message, index) => {
            return (
              <Row
                key={index}
                id={message.senderId === id ? "user-message" : "other-message"}
              >
                <Col>
                  {message.senderId !== id && (
                    <Row style={{ color: "white" }}>{message.senderId}</Row>
                  )}

                  <div
                    style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
                  >
                    {message.content}
                  </div>
                </Col>
              </Row>
            );
          })}
      </Container>

      <Form onSubmit={(e) => handleSend(e)} id="form-style">
        <Row>
          <Col>
            <Form.Group>
              {" "}
              <Form.Control
                id="input-form"
                type="text"
                value={message}
                placeholder="Enter your message..."
                onChange={handleTyping}
                autoComplete="off"
              />
            </Form.Group>
          </Col>

          <Col>
            <Button type="submit" id="submit-button">
              Send
            </Button>
          </Col>
        </Row>
      </Form>

      <div ref={bottomContainer}></div>
    </React.Fragment>
  );
};

export default Client;
