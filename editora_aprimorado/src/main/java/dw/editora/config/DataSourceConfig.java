package dw.editora.config;

import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URI;
import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import com.zaxxer.hikari.HikariDataSource;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.url:jdbc:postgresql://localhost:5432/editora}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:postgres}")
    private String username;

    @Value("${spring.datasource.password:SENHA}")
    private String password;

    @Bean
    @Primary
    public DataSource dataSource() {
        HostPort hostPort = extrairHostPort(datasourceUrl);

        if (hostPort != null && isReachable(hostPort.host, hostPort.port)) {
            log.info("✔ PostgreSQL detectado em {}:{}. Conectando ao banco de dados: {}",
                    hostPort.host, hostPort.port, datasourceUrl);
            HikariDataSource ds = new HikariDataSource();
            ds.setDriverClassName("org.postgresql.Driver");
            ds.setJdbcUrl(datasourceUrl);
            ds.setUsername(username);
            ds.setPassword(password);
            ds.setMaximumPoolSize(10);
            ds.setMinimumIdle(5);
            return ds;
        }

        log.warn("⚠ PostgreSQL NÃO foi detectado em {} (conexão recusada ou serviço parado).",
                hostPort != null ? hostPort.host + ":" + hostPort.port : datasourceUrl);
        log.info("🚀 Alternando automaticamente para banco H2 em memória com compatibilidade PostgreSQL!");

        HikariDataSource ds = new HikariDataSource();
        ds.setDriverClassName("org.h2.Driver");
        ds.setJdbcUrl("jdbc:h2:mem:editora;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1");
        ds.setUsername("sa");
        ds.setPassword("");
        ds.setMaximumPoolSize(10);
        return ds;
    }

    private boolean isReachable(String host, int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), 1000);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private HostPort extrairHostPort(String jdbcUrl) {
        try {
            if (jdbcUrl != null && jdbcUrl.startsWith("jdbc:postgresql://")) {
                String cleanUrl = jdbcUrl.substring("jdbc:".length());
                URI uri = URI.create(cleanUrl);
                String host = uri.getHost() != null ? uri.getHost() : "localhost";
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                return new HostPort(host, port);
            }
        } catch (Exception ignored) {
        }
        return new HostPort("localhost", 5432);
    }

    private static class HostPort {
        final String host;
        final int port;

        HostPort(String host, int port) {
            this.host = host;
            this.port = port;
        }
    }
}
